import type { Dirent } from 'node:fs';

export interface ProcessFolderPathOptions {
    fileConcurrent?: boolean;
    folderConcurrent?: boolean;
}

export interface LoadInteractionHandlerMapOptions {
    fileConcurrent?: boolean;
    folderConcurrent?: boolean;
}

export interface LoadEventHandlerOptions {
    fileConcurrent?: boolean;
    folderConcurrent?: boolean;
    listenerPrependedArgs?: unknown[];
}

export type ProcessFileCallback = (
    file: Dirent,
    folderPath: string,
) => void | Promise<void>;

export type ProcessFileOverride = (
    file: Dirent,
    folderPath: string,
) => Promise<void>;
