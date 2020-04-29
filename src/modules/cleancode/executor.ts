import { spawn } from 'child_process';
import * as vscode from 'vscode';
import { EXTENSION_NAME, NO_SLN_WARN, NONZERO_RET_CODE } from '../../constants';
import { selectSolutionFile } from '../../utils/workspace';

export class CleanupCodeExecutor {
	public constructor(
		private readonly output: vscode.OutputChannel,
		private readonly statusBarItem: vscode.StatusBarItem
	) { }

	private showStatusBarItem() {
		this.statusBarItem.text = "$(sync~spin) Cleanup Code";
		this.statusBarItem.tooltip = "R#: Cleaning up code";
		this.statusBarItem.command = `${EXTENSION_NAME}.showoutput`;
		this.statusBarItem.show();
	}

	private hideStatusBarItem() {
		this.statusBarItem.text = EXTENSION_NAME;
		this.statusBarItem.tooltip = undefined;
		this.statusBarItem.command = undefined;
		this.statusBarItem.hide();
	}

	private executeCleanupCode(filePath: string): void {
		this.output.appendLine(`Cleanup Code command is running for '${filePath}'...`);

		const cp = spawn('cleanupcode', [filePath]);

		cp.stdin?.addListener('data', message => this.output.append(message.toString()));
		cp.stdout?.addListener('data', message => this.output.append(message.toString()));
		cp.stderr?.addListener('data', message => this.output.append(message.toString()));

		cp.on('exit', code => {
			if (code !== 0) {
				vscode.window.showErrorMessage(NONZERO_RET_CODE);
			}

			this.hideStatusBarItem();
			this.output.appendLine('Done.');
		});
	}

	public run() {
		selectSolutionFile(filePath => {
			if (!filePath) {
				vscode.window.showWarningMessage(NO_SLN_WARN);
				return;
			}

			vscode.window.showQuickPick(["No, don't", 'Yes, cleanup my code.'], {
				placeHolder: 'WARNING! Your code will be modified by R#, continue?'
			}).then(value => {
				if (value && value.startsWith('Yes')) {
					this.showStatusBarItem();
					this.executeCleanupCode(filePath);
				}
			});
		});
	}
}
