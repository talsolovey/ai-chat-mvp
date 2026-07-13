import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { Checkpoint, CheckpointMetadata } from '@langchain/langgraph';

/**
 * A MongoDBSaver that keeps only the newest checkpoint per thread.
 *
 * The stock saver writes a full copy of the graph state after every superstep
 * and never deletes anything, so storage grows quadratically with
 * conversation length. Only the latest checkpoint is ever read to continue a
 * thread — and even if a thread's checkpoints disappear entirely, the
 * stream-reply use case re-seeds it from the messages collection (the source
 * of truth). Older checkpoints are therefore pure waste and are deleted as
 * soon as a newer one is saved.
 */
export class LatestOnlyMongoDBSaver extends MongoDBSaver {
  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
  ): Promise<RunnableConfig> {
    const updatedConfig = await super.put(config, checkpoint, metadata);

    const threadId = config.configurable?.thread_id as string | undefined;
    if (!threadId) {
      return updatedConfig;
    }
    const checkpointNamespace =
      (config.configurable?.checkpoint_ns as string | undefined) ?? '';

    const olderThanCurrentCheckpoint = {
      thread_id: threadId,
      checkpoint_ns: checkpointNamespace,
      checkpoint_id: { $lt: checkpoint.id },
    };
    await Promise.all([
      this.db
        .collection(this.checkpointCollectionName)
        .deleteMany(olderThanCurrentCheckpoint),
      this.db
        .collection(this.checkpointWritesCollectionName)
        .deleteMany(olderThanCurrentCheckpoint),
    ]);

    return updatedConfig;
  }
}
