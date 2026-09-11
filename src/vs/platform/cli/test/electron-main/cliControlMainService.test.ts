/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { Event } from '../../../../base/common/event.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { IUpdateService, IUpdateStatus, State } from '../../../update/common/update.js';
import { CliCommandExitCode } from '../../common/cliControl.js';
import { CliControlMainService } from '../../electron-main/cliControlMainService.js';

suite('CliControlMainService', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	function createService(status: IUpdateStatus | Error): CliControlMainService {
		const updateService = {
			onStateChange: Event.None,
			state: State.Uninitialized,
			getStatus: () => status instanceof Error ? Promise.reject(status) : Promise.resolve(status)
		} as unknown as IUpdateService;

		return new CliControlMainService(updateService);
	}

	const availableStatus: IUpdateStatus = {
		currentVersion: '1.0.0',
		quality: 'stable',
		platform: 'win32-x64-user',
		installType: 'windows-user-setup',
		state: 'idle',
		updateAvailable: true,
		availableVersion: '1.1.0',
		canInstall: true,
		disabledReason: null
	};

	test('prints stable JSON status', async () => {
		const service = createService(availableStatus);

		const result = await service.runUpdateCommand({ command: 'status', json: true });

		assert.deepStrictEqual(result, {
			exitCode: CliCommandExitCode.Success,
			stdout: `${JSON.stringify({ schemaVersion: 1, ...availableStatus })}\n`
		});
	});

	test('prints available version', async () => {
		const service = createService(availableStatus);

		const result = await service.runUpdateCommand({ command: 'status' });

		assert.deepStrictEqual(result, {
			exitCode: CliCommandExitCode.Success,
			stdout: 'Update available: 1.1.0 (current version: 1.0.0).\n'
		});
	});

	test('prints availability when the version is unknown', async () => {
		const service = createService({ ...availableStatus, availableVersion: null });

		const result = await service.runUpdateCommand({ command: 'status' });

		assert.deepStrictEqual(result, {
			exitCode: CliCommandExitCode.Success,
			stdout: 'An update is available, but its version could not be determined.\n'
		});
	});

	test('reports metadata failures on stderr', async () => {
		const service = createService(new Error('network unavailable'));

		const result = await service.runUpdateCommand({ command: 'status' });

		assert.deepStrictEqual(result, {
			exitCode: CliCommandExitCode.Failure,
			stderr: 'Unable to check for updates: network unavailable\n'
		});
	});
});
