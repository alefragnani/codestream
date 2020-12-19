"use strict";
const webpack = require("webpack");
const fs = require("fs");
const path = require("path");
const CleanPlugin = require("clean-webpack-plugin");
const FileManagerPlugin = require("filemanager-webpack-plugin");
const ForkTsCheckerPlugin = require("fork-ts-checker-webpack-plugin");
const HtmlPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

module.exports = function(env, argv) {
	env = env || {};
	env.analyzeBundle = Boolean(env.analyzeBundle);
	env.analyzeBundleWebview = Boolean(env.analyzeBundleWebview);
	env.analyzeDeps = Boolean(env.analyzeDeps);
	env.production = env.analyzeBundle || env.analyzeBundleWebview || Boolean(env.production);
	env.reset = Boolean(env.reset);
	env.watch = Boolean(argv.watch || argv.w);

	let protocolPath = path.resolve(__dirname, "src/protocols");
	if (!fs.existsSync(protocolPath)) {
		fs.mkdirSync(protocolPath);
	}

	console.log("Ensuring extension symlink to the agent protocol folder...");
	createFolderSymlinkSync(
		path.resolve(__dirname, "../shared/agent/src/protocol"),
		path.resolve(protocolPath, "agent"),
		env
	);

	console.log("Ensuring extension symlink to the webview protocol folder...");
	createFolderSymlinkSync(
		path.resolve(__dirname, "../shared/ui/ipc"),
		path.resolve(protocolPath, "webview"),
		env
	);

	protocolPath = path.resolve(__dirname, "../shared/ui/protocols");
	if (!fs.existsSync(protocolPath)) {
		fs.mkdirSync(protocolPath);
	}

	console.log("Ensuring webview symlink to the agent protocol folder...");
	createFolderSymlinkSync(
		path.resolve(__dirname, "../shared/agent/src/protocol"),
		path.resolve(protocolPath, "agent"),
		env
	);

	return [getExtensionConfig(env), getWebviewConfig(env)];
};

function getExtensionConfig(env) {
	/**
	 * @type any[]
	 */
	const plugins = [
		new CleanPlugin(["dist/agent*", "dist/extension*"], { verbose: false }),
		new FileManagerPlugin({
			onEnd: [
				{
					copy: [
						{
							// TODO: Use environment variable if exists
							source: path.resolve(__dirname, "../shared/agent/dist/*"),
							destination: "dist/"
						},
						{
							source: path.resolve(__dirname, "codestream-*.info"),
							destination: "dist/"
						}
					]
				}
			]
		})
	];

	if (env.analyzeDeps) {
		plugins.push(
			new CircularDependencyPlugin({
				cwd: __dirname,
				exclude: /node_modules/,
				failOnError: false,
				onDetected({ module: webpackModuleRecord, paths, compilation }) {
					if (paths.some(p => /container\.ts/.test(p))) return;

					compilation.warnings.push(new Error(paths.join(" -> ")));
				}
			})
		);
	}

	if (env.analyzeBundle) {
		plugins.push(new BundleAnalyzerPlugin());
	}

	return {
		name: "extension",
		entry: "./src/extension.ts",
		mode: env.production ? "production" : "development",
		target: "node",
		node: {
			__dirname: false
		},
		devtool: "source-map",
		output: {
			libraryTarget: "commonjs2",
			filename: "extension.js"
		},
		optimization: {
			minimizer: [
				new TerserPlugin({
					cache: true,
					parallel: true,
					sourceMap: true,
					terserOptions: {
						ecma: 8,
						// Keep the class names otherwise @log won't provide a useful name
						keep_classnames: true,
						module: true
					}
				})
			]
		},
		externals: {
			vscode: "commonjs vscode"
		},
		module: {
			rules: [
				{
					test: /\.ts$/,
					enforce: "pre",
					loader: "eslint-loader",
					exclude: /node_modules/,
					options: { fix: true }
				},
				{
					test: /\.tsx?$/,
					use: "ts-loader",
					exclude: /node_modules|\.d\.ts$/
				}
			],
			// Removes `Critical dependency: the request of a dependency is an expression` from `./node_modules/vsls/vscode.js`
			exprContextRegExp: /^$/,
			exprContextCritical: false
		},
		resolve: {
			extensions: [".ts", ".tsx", ".js", ".jsx"],
			plugins: [new TsconfigPathsPlugin()],
			// Treats symlinks as real files -- using their "current" path
			symlinks: false
		},
		plugins: plugins,
		stats: {
			all: false,
			assets: true,
			builtAt: true,
			env: true,
			errors: true,
			timings: true,
			warnings: true
		}
	};
}

function getWebviewConfig(env) {
	const context = path.resolve(__dirname, "src/webviews/app");

	/**
	 * @type any[]
	 */
	const plugins = [
		new CleanPlugin(["dist/webview", "webview.html"]),
		new webpack.DefinePlugin(
			Object.assign(
				{ "global.atom": false },
				env.production ? { "process.env.NODE_ENV": JSON.stringify("production") } : {}
			)
		),
		new MiniCssExtractPlugin({
			filename: "webview.css"
		}),
		new HtmlPlugin({
			template: "index.html",
			filename: path.resolve(__dirname, "webview.html"),
			inlineSource: ".(js|css)$",
			inject: true,
			minify: env.production
				? {
						removeComments: true,
						collapseWhitespace: true,
						removeRedundantAttributes: true,
						useShortDoctype: true,
						removeEmptyAttributes: true,
						removeStyleLinkTypeAttributes: true,
						keepClosingSlash: true
				  }
				: false
		}),
		new HtmlWebpackInlineSourcePlugin(),
		new ForkTsCheckerPlugin({
			async: false,
			useTypescriptIncrementalApi: false
		})
	];

	if (env.analyzeBundleWebview) {
		plugins.push(new BundleAnalyzerPlugin());
	}
	if (env.production) {
		plugins.push(
			new TerserPlugin({
				cache: true,
				parallel: true,
				sourceMap: true,
				terserOptions: {
					ecma: 8,
					// Keep the class names otherwise @log won't provide a useful name
					keep_classnames: true,
					module: true,
					compress: {
						pure_funcs: ["console.warn"]
					}
				}
			})
		);
	}

	return {
		name: "webview",
		context: context,
		entry: {
			webview: ["./index.ts", "./styles/webview.less"]
		},
		mode: env.production ? "production" : "development",
		node: false,
		devtool: !env.production ? "eval-source-map" : undefined,
		output: {
			filename: "[name].js",
			path: path.resolve(__dirname, "dist/webview"),
			publicPath: "{{root}}/dist/webview/"
		},
		optimization: {
			minimizer: [
				new TerserPlugin({
					cache: true,
					parallel: true,
					sourceMap: true,
					terserOptions: {
						ecma: 8
					}
				}),
				new OptimizeCSSAssetsPlugin({})
			],
			splitChunks: {
				cacheGroups: {
					default: false,
					data: {
						chunks: "all",
						filename: "webview-data.js",
						test: /\.json/
					}
				}
			}
		},
		module: {
			rules: [
				{
					test: /\.html$/,
					use: "html-loader",
					exclude: /node_modules/
				},
				{
					test: /\.(js|ts)x?$/,
					use: {
						loader: "babel-loader",
						options: {
							plugins: ["babel-plugin-styled-components"]
						}
					},
					exclude: /node_modules/
				},
				{
					test: /\.less$/,
					use: [
						{
							loader: MiniCssExtractPlugin.loader
						},
						{
							loader: "css-loader",
							options: {
								sourceMap: !env.production,
								url: false
							}
						},
						{
							loader: "less-loader",
							options: {
								sourceMap: !env.production
							}
						}
					],
					exclude: /node_modules/
				}
			]
		},
		resolve: {
			extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
			// Dunno why this won't work
			// plugins: [
			// 	new TsconfigPathsPlugin({
			// 		configFile: path.resolve(context, "tsconfig.json"),
			// 		extensions: [".ts", ".tsx", ".js", ".jsx", ".less"]
			// 	})
			// ],
			alias: {
				"@codestream/protocols/agent": path.resolve(
					__dirname,
					"../shared/ui/protocols/agent/agent.protocol.ts"
				),
				"@codestream/protocols/api": path.resolve(
					__dirname,
					"../shared/ui/protocols/agent/api.protocol.ts"
				),
				"@codestream/protocols/webview": path.resolve(
					__dirname,
					"../shared/ui/ipc/webview.protocol.ts"
				),
				"@codestream/webview": path.resolve(__dirname, "../shared/ui/"),
				react: path.resolve(__dirname, "../shared/ui/node_modules/react"),
				"react-dom": path.resolve(__dirname, "../shared/ui/node_modules/react-dom"),
				"vscode-jsonrpc": path.resolve(__dirname, "../shared/ui/vscode-jsonrpc.shim.ts")
			},
			// Treats symlinks as real files -- using their "current" path
			symlinks: false
		},
		plugins: plugins,
		stats: {
			all: false,
			assets: true,
			builtAt: true,
			env: true,
			errors: true,
			timings: true,
			warnings: true
		}
	};
}

function createFolderSymlinkSync(source, target, env) {
	if (env.reset) {
		console.log("Unlinking symlink...");
		try {
			fs.unlinkSync(target);
		} catch (ex) {}
	} else if (fs.existsSync(target)) {
		return;
	}

	console.log("Creating symlink...");
	try {
		fs.symlinkSync(source, target, "dir");
	} catch (ex) {
		try {
			fs.unlinkSync(target);
			fs.symlinkSync(source, target, "dir");
		} catch (ex) {
			console.log(`Symlink creation failed; ${ex}`);
		}
	}
}
