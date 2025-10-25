import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the InstaPay contract using the deployer account
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployInstaPay: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the first account yielded by `getNamedAccounts`
    or `getSigners`.

    You can set your deployer account in hardhat.config.ts
    NOTICE: This script will not work on production networks... You must set the deployer account!
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("InstaPay", {
    from: deployer,
    // Contract constructor arguments (InstaPay ka koi constructor nahi hai)
    args: [],
    log: true, // Deploy ki details console mein dikhao
    // autoMine: true // speeds up deployment on local network (optional)
    autoMine: true,
  });
};

export default deployInstaPay;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags InstaPay
deployInstaPay.tags = ["InstaPay"];
