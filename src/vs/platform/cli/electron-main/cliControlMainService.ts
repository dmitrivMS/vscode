/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../nls.js';
import { getErrorMessage } from '../../../base/common/errors.js';
import { IUpdateService } from '../../update/common/update.js';
import { CliCommandExitCode, ICliCommandResult, ICliControlMainService, IUpdateCliRequest } from '../common/cliControl.js';

export class CliControlMainService implements ICliControlMainService {
	declare readonly _serviceBrand: undefined;

	constructor(
		@IUpdateService private readonly updateService: IUpdateService,
	) { }

	async runUpdateCommand(request: IUpdateCliRequest): Promise<ICliCommandResult> {
		if (request.command === 'status') {
			return this.runUpdateStatus(request);
		}

		const command = `update ${request.command}`;
		return {
			exitCode: CliCommandExitCode.Failure,
			stderr: localize('updateCommandNotImplemented', "The '{0}' command is not available yet.", command)
		};
	}

	private async runUpdateStatus(request: IUpdateCliRequest): Promise<ICliCommandResult> {
		try {
			const updateStatus = await this.updateService.getStatus();
			const status = {
				schemaVersion: 1 as const,
				currentVersion: updateStatus.currentVersion,
				quality: updateStatus.quality,
				platform: updateStatus.platform,
				installType: updateStatus.installType,
				state: updateStatus.state,
				updateAvailable: updateStatus.updateAvailable,
				availableVersion: updateStatus.availableVersion,
				canInstall: updateStatus.canInstall,
				disabledReason: updateStatus.disabledReason
			};

			if (request.json) {
				return {
					exitCode: CliCommandExitCode.Success,
					stdout: `${JSON.stringify(status)}\n`
				};
			}

			if (status.disabledReason) {
				return {
					exitCode: CliCommandExitCode.Success,
					stdout: `${localize('updateStatusDisabled', "Updates are disabled ({0}).", status.disabledReason)}\n`
				};
			}

			if (status.updateAvailable) {
				if (!status.availableVersion) {
					return {
						exitCode: CliCommandExitCode.Success,
						stdout: `${localize('updateStatusAvailableUnknownVersion', "An update is available, but its version could not be determined.")}\n`
					};
				}

				return {
					exitCode: CliCommandExitCode.Success,
					stdout: `${localize('updateStatusAvailable', "Update available: {0} (current version: {1}).", status.availableVersion, status.currentVersion)}\n`
				};
			}

			return {
				exitCode: CliCommandExitCode.Success,
				stdout: `${localize('updateStatusCurrent', "VS Code is up to date (version {0}).", status.currentVersion)}\n`
			};
		} catch (error) {
			return {
				exitCode: CliCommandExitCode.Failure,
				stderr: `${localize('updateStatusError', "Unable to check for updates: {0}", getErrorMessage(error))}\n`
			};
		}
	}
}
