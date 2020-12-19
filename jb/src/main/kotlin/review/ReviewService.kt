package com.codestream.review

import com.codestream.agentService
import com.codestream.protocols.agent.GetFileContentsAtRevisionParams
import com.codestream.protocols.agent.GetLocalReviewContentsParams
import com.codestream.protocols.agent.GetReviewContentsResult
import com.intellij.diff.DiffDialogHints
import com.intellij.diff.DiffManagerEx
import com.intellij.diff.chains.DiffRequestChain
import com.intellij.diff.editor.DiffRequestProcessorEditor
import com.intellij.diff.editor.SimpleDiffVirtualFile
import com.intellij.diff.impl.CacheDiffRequestChainProcessor
import com.intellij.diff.requests.SimpleDiffRequest
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Key
import com.intellij.openapi.util.KeyWithDefaultValue
import com.intellij.openapi.util.registry.Registry
import com.intellij.openapi.vfs.VirtualFile
import java.lang.reflect.Field
import java.lang.reflect.Method

enum class ReviewDiffSide(val path: String) {
    LEFT("left"),
    RIGHT("right")
}

val REVIEW_DIFF = KeyWithDefaultValue.create("REVIEW_DIFF", false)
val REPO_ID = Key<String>("REPO_ID")
val PATH = Key<String>("PATH")

class ReviewService(private val project: Project) {

    var lastReviewFile: VirtualFile? = null
    private val processorField: Field =
        DiffRequestProcessorEditor::class.java.getDeclaredField("processor").also { it.isAccessible = true }
    private val goToPrevChangeMethod: Method =
        CacheDiffRequestChainProcessor::class.java.getDeclaredMethod("goToPrevChange", Boolean::class.java)
            .also { it.isAccessible = true }
    private val goToNextChangeMethod: Method =
        CacheDiffRequestChainProcessor::class.java.getDeclaredMethod("goToNextChange", Boolean::class.java)
            .also { it.isAccessible = true }
    private var diffChain: DiffRequestChain? = null
    private var currentKey: String? = null

    suspend fun showDiff(reviewId: String, repoId: String, checkpoint: Int?, path: String) {
        val agent = project.agentService ?: return
        val key = "$reviewId|$repoId|$checkpoint"

        if (reviewDiffEditor == null || diffChain == null || key != currentKey) {
            closeDiff()
            val review = agent.getReview(reviewId)
            currentKey = key

            val changeset = review.reviewChangesets.findLast {
                it.repoId == repoId && (checkpoint == null || it.checkpoint == checkpoint)
            } ?: return

            val files = if (checkpoint == null) changeset.modifiedFiles else changeset.modifiedFilesInCheckpoint
            val producers = files.map { it.file }.map {
                ReviewDiffRequestProducer(project, review, repoId, it, checkpoint)
            }

            diffChain = ReviewDiffRequestChain(producers).also { chain ->
                chain.putUserData(REVIEW_DIFF, true)
                chain.index = producers.indexOfFirst {
                    it.repoId == repoId && it.path == path
                }
            }

            val registryValue = Registry.get("show.diff.as.editor.tab")
            val original = registryValue.asBoolean()

            ApplicationManager.getApplication().invokeLater {
                try {
                    registryValue.setValue(true)
                    DiffManagerEx.getInstance().showDiffBuiltin(project, diffChain!!, DiffDialogHints.FRAME)
                } finally {
                    registryValue.setValue(original)
                }
            }
        }

        val index = (diffChain!!.requests as List<ReviewDiffRequestProducer>).indexOfFirst {
            it.repoId == repoId && it.path == path
        }
        ApplicationManager.getApplication().invokeLater {
            val processor = reviewDiffEditor?.let { processorField.get(it) as CacheDiffRequestChainProcessor }
            processor?.setCurrentRequest(index)
        }
    }

    suspend fun showLocalDiff(
        repoId: String,
        path: String,
        oldPath: String?,
        includeSaved: Boolean,
        includeStaged: Boolean,
        editingReviewId: String?,
        baseSha: String
    ) {
        val agent = project.agentService ?: return

        val rightVersion = when {
            includeSaved -> "saved"
            includeStaged -> "staged"
            else -> "head"
        }
        val contents = agent.getLocalReviewContents(
            GetLocalReviewContentsParams(
                repoId,
                path,
                oldPath,
                editingReviewId,
                baseSha,
                rightVersion
            )
        )
        showDiffContent("local", null, repoId, path, oldPath, contents, "New Review")
    }

    private fun showDiffContent(
        reviewId: String,
        checkpoint: Int?,
        repoId: String,
        path: String,
        oldPath: String?,
        contents: GetReviewContentsResult,
        title: String
    ) {
        val leftContent =
            createReviewDiffContent(project, reviewId, checkpoint, repoId, ReviewDiffSide.LEFT, oldPath ?: path, contents.left)
        val rightContent =
            createReviewDiffContent(project, reviewId, checkpoint, repoId, ReviewDiffSide.RIGHT, path, contents.right)
        val diffRequest = SimpleDiffRequest(title, leftContent, rightContent, oldPath ?: path, path)
        diffRequest.putUserData(REVIEW_DIFF, true)
        val file = SimpleDiffVirtualFile(diffRequest)
        ApplicationManager.getApplication().invokeLater {
            val manager = FileEditorManager.getInstance(project)
            lastReviewFile?.let { manager.closeFile(it) }
            lastReviewFile = file
            manager.openFile(file, true)
        }
    }

    suspend fun showRevisionsDiff(
        repoId: String,
        filePath: String,
        headSha: String,
        headBranch: String,
        baseSha: String,
        baseBranch: String,
        context: CodeStreamDiffUriContext?
    ) {
        val agent = project.agentService ?: return
        val key = "$filePath|$repoId"

        if (reviewDiffEditor == null || diffChain == null || key != currentKey) {
            closeDiff()
            val filesPath: List<String>
            if (context?.pullRequest != null) {
                val prFiles = agent.getPullRequestFiles(context.pullRequest.id, context.pullRequest.providerId)
                filesPath = prFiles.map { it.filename }
            } else {
                filesPath = listOf(filePath)
            }

            currentKey = key

            val producers = filesPath.map{
                PullRequestProducer(project, repoId, it, headSha, headBranch, baseSha, baseBranch, context)
            }

            diffChain = PullRequestChain(producers).also { chain ->
                chain.putUserData(REVIEW_DIFF, true)
                chain.index = producers.indexOfFirst {
                    it.filePath == filePath
                }
            }

            val registryValue = Registry.get("show.diff.as.editor.tab")
            val original = registryValue.asBoolean()

            ApplicationManager.getApplication().invokeLater {
                try {
                    registryValue.setValue(true)
                    DiffManagerEx.getInstance().showDiffBuiltin(project, diffChain!!, DiffDialogHints.FRAME)
                } finally {
                    registryValue.setValue(original)
                }
            }
        }

        val index = (diffChain!!.requests as List<PullRequestProducer>).indexOfFirst {
            it.repoId == repoId && it.filePath == filePath
        }
        ApplicationManager.getApplication().invokeLater {
            val processor = reviewDiffEditor?.let { processorField.get(it) as CacheDiffRequestChainProcessor }
            processor?.setCurrentRequest(index)
        }
    }

    fun closeDiff() {
        reviewDiffEditor?.let {
            ApplicationManager.getApplication().invokeLater {
                FileEditorManager.getInstance(project).closeFile(it.file)
            }
        }
    }

    fun nextDiff() {
        ApplicationManager.getApplication().invokeLater {
            reviewDiffEditor?.processor?.let { goToNextChangeMethod.invoke(it, true) }
        }
    }

    fun previousDiff() {
        ApplicationManager.getApplication().invokeLater {
            reviewDiffEditor?.processor?.let { goToPrevChangeMethod.invoke(it, true) }
        }
    }

    private val reviewDiffEditor
        get() = FileEditorManager.getInstance(project).allEditors.find {
            it is DiffRequestProcessorEditor
                && (processorField.get(it) as? CacheDiffRequestChainProcessor)?.requestChain?.getUserData(REVIEW_DIFF) == true
        } as DiffRequestProcessorEditor?

    private val DiffRequestProcessorEditor.processor
        get() = processorField.get(this) as CacheDiffRequestChainProcessor
}
