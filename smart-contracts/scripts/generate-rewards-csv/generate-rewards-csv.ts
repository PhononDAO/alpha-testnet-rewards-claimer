import "@nomiclabs/hardhat-ethers";
import { ethers } from "ethers";
import { task } from "hardhat/config";
import { arrayToCsVUsingPropertiesAsHeadings } from "../../utils/csv-utils";
import d from "./input.json";

type TaskDescription =
  | "User has registered with the phonon logging service"
  | "User has created 10 asset backed phonons backed by multiple currencies"
  | "Sent a phonon"
  | "A nickname has been given to a card"
  | "Phonons of 3 different currency types have been redeemed";

type Task = {
  Achieved: boolean;
  Desc: TaskDescription;
};

type Data = {
  [key: string]: Task[];
};

const REWARDS = 120_000;

// People who demonstrated best effort completing the tasks but don't appear in the logs
const MANUAL_ADDITIONS = ["0xD98A1655CC97651192a983D9692A86B54cE9b14a"];

// Task that takes the log data and outputs a csv listing who gets rewards based on tasks completed.
// Anyone who completed the "registration" task and one other task get the full rewards
task("generate-rewards-csv").setAction(async () => {
  const data = d as Data;

  let totalCount: number = 0;
  const getRewards: { address: string; amount: number }[] = [];
  const dontGetRewards: string[] = [];

  for (const address of Object.keys(data)) {
    if (!ethers.utils.isAddress(address)) {
      continue;
    }

    totalCount++;

    const tasks = data[address];

    if (
      tasks.some(
        (t) =>
          t.Desc !== "User has registered with the phonon logging service" &&
          t.Achieved
      )
    ) {
      // everyone is getting the same rewards now so hardcode amount
      getRewards.push({ address, amount: REWARDS });
    } else {
      dontGetRewards.push(address);
    }
  }

  for (const address of MANUAL_ADDITIONS) {
    getRewards.push({ address, amount: REWARDS });
  }
  await arrayToCsVUsingPropertiesAsHeadings("./output.csv", getRewards);

  console.log("Dont get rewards");
  console.log(`${dontGetRewards.length}/${totalCount}`, dontGetRewards);
});
