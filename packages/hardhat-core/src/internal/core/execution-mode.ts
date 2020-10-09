import debug from "debug";
import findUp from "find-up";
import path from "path";

const log = debug("hardhat:core:execution-mode");

/**
 * This module defines different Hardhat execution modes and autodetects them.
 *
 * IMPORTANT: This will have to be revisited once Yarn PnP and npm's tink get
 * widely adopted.
 */
export enum ExecutionMode {
  EXECUTION_MODE_TS_NODE_TESTS,
  EXECUTION_MODE_LINKED,
  EXECUTION_MODE_GLOBAL_INSTALLATION,
  EXECUTION_MODE_LOCAL_INSTALLATION,
}

const workingDirectoryOnLoad = process.cwd();

export function getExecutionMode(): ExecutionMode {
  const isInstalled = __filename.includes("node_modules");

  if (!isInstalled) {
    // When running the tests with ts-node we set the CWD to the root of
    // hardhat. We could check if the __filename ends with .ts
    if (__dirname.startsWith(workingDirectoryOnLoad)) {
      return ExecutionMode.EXECUTION_MODE_TS_NODE_TESTS;
    }

    return ExecutionMode.EXECUTION_MODE_LINKED;
  }

  try {
    if (require("is-installed-globally")) {
      return ExecutionMode.EXECUTION_MODE_GLOBAL_INSTALLATION;
    }
  } catch (error) {
    log(
      "Failed to load is-installed-globally. Using alternative local installation detection\n",
      error
    );

    if (!alternativeIsLocalInstallation()) {
      return ExecutionMode.EXECUTION_MODE_GLOBAL_INSTALLATION;
    }
  }

  return ExecutionMode.EXECUTION_MODE_LOCAL_INSTALLATION;
}

/**
 * Checks whether we're using Hardhat in development mode (that is, we're working _on_ Hardhat).
 */
export function isLocalDev(): boolean {
  // TODO: This may give a false positive under yarn PnP
  return __filename.endsWith(".ts") || !__filename.includes("node_modules");
}

/**
 * This is a somewhat more limited detection, but we use it if
 * is-installed-globally fails.
 *
 * If a user installs hardhat locally, and executes it from outside the
 * directory that contains the `node_module` with the installation, this will
 * fail and return `false`.
 */
function alternativeIsLocalInstallation(): boolean {
  let cwd = workingDirectoryOnLoad;

  while (true) {
    const nodeModules = findUp.sync("node_modules", { cwd });

    if (nodeModules === null) {
      return false;
    }

    if (__dirname.startsWith(nodeModules)) {
      return true;
    }

    cwd = path.join(nodeModules, "..", "..");
  }
}
