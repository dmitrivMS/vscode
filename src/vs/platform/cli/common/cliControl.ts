/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../instantiation/common/instantiation.js';
import { IUpdateStatus } from '../../update/common/update.js';

export const ICliControlMainService = createDecorator<ICliControlMainService>('cliControlMainService');

export const enum CliCommandExitCode {
	Success = 0,
	Failure = 1,
	InvalidUsage = 2
}

export interface IUpdateCliRequest {
	readonly command: 'status' | 'install';
	readonly json?: boolean;
	readonly version?: string;
	readonly force?: boolean;
}

export interface IUpdateCliStatus extends IUpdateStatus {
	readonly schemaVersion: 1;
}

export interface ICliCommandResult {
	readonly exitCode: CliCommandExitCode;
	readonly stdout?: string;
	readonly stderr?: string;
}

export interface ICliControlMainService {
	readonly _serviceBrand: undefined;

	runUpdateCommand(request: IUpdateCliRequest): Promise<ICliCommandResult>;
}
