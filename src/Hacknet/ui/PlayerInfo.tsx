/**
 * React Component for displaying Player info and stats on the Hacknet Node UI.
 * This includes:
 * - Player's money
 * - Player's production from Hacknet Nodes
 */
import React from "react";

import { hasHacknetServers } from "../HacknetHelpers";
import { Player } from "@player";
import { Money } from "../../ui/React/Money";
import { MoneyRate } from "../../ui/React/MoneyRate";
import { HashRate } from "../../ui/React/HashRate";
import { Hashes } from "../../ui/React/Hashes";
import { Paper, Typography } from "@mui/material";
import { StatsTable } from "../../ui/React/StatsTable";
import { Tooltip } from "@mui/material";
import { GetServer } from "../../Server/AllServers";
import { HacknetNode } from "../HacknetNode";
import { HacknetServer } from "../HacknetServer";
import { EventUpdater } from "../../ui/React/EventUpdater";
import { GameCycleEvents } from "../../engine";

// Generator function for various global values. Declared out here so they
// have stable identities.
function moneySpent() {
  return -Player.moneySourceA.hacknet_expenses || 0;
}

function moneyProduced() {
  return Player.moneySourceA.hacknet;
}

function getHashes() {
  return Player.hashManager.hashes;
}

function getHashCap() {
  return Player.hashManager.capacity;
}

function totalProduction() {
  let total = 0;
  for (let i = 0; i < Player.hacknetNodes.length; ++i) {
    const node = Player.hacknetNodes[i];
    if (hasHacknetServers()) {
      if (node instanceof HacknetNode) throw new Error("node was hacknet node"); // should never happen
      const hserver = GetServer(node);
      if (!(hserver instanceof HacknetServer)) throw new Error("node was not hacknet server"); // should never happen
      if (hserver) {
        total += hserver.hashRate;
      } else {
        console.warn(`Could not find Hacknet Server object in AllServers map (i=${i})`);
      }
    } else {
      if (typeof node === "string") throw new Error("node was ip string"); // should never happen
      total += node.moneyGainRatePerSecond;
    }
  }
  return total;
}

export function PlayerInfo(): React.ReactElement {
  const rows: React.ReactNode[][] = [];
  rows.push([
    "Money Spent:",
    <EventUpdater key="spent" events={GameCycleEvents} generator={moneySpent}>
      {(x) => <Money money={x} />}
    </EventUpdater>,
  ]);
  rows.push([
    "Money Produced:",
    <EventUpdater key="produced" events={GameCycleEvents} generator={moneyProduced}>
      {(x) => <Money money={x} />}
    </EventUpdater>,
  ]);
  if (hasHacknetServers()) {
    rows.push([
      "Hashes:",
      <span key="hashes">
        <EventUpdater events={GameCycleEvents} generator={getHashes}>
          {(x) => <Hashes hashes={x} />}
        </EventUpdater>
        /
        <EventUpdater events={GameCycleEvents} generator={getHashCap}>
          {(x) => <Hashes hashes={x} />}
        </EventUpdater>
      </span>,
    ]);
    rows.push([
      "Hash Rate:",
      <Tooltip
        key="moneyRate"
        title={
          <Typography>
            <EventUpdater events={GameCycleEvents} generator={totalProduction}>
              {(x) => <MoneyRate money={(x * 1e6) / 4} />}
            </EventUpdater>{" "}
            if sold for money
          </Typography>
        }
      >
        <span>
          <EventUpdater key="hashRate" events={GameCycleEvents} generator={totalProduction}>
            {(x) => <HashRate hashes={x} />}
          </EventUpdater>
        </span>
      </Tooltip>,
    ]);
  } else {
    rows.push([
      "Production Rate:",
      <EventUpdater key="moneyRate" events={GameCycleEvents} generator={totalProduction}>
        {(x) => <MoneyRate money={x} />}
      </EventUpdater>,
    ]);
  }

  return (
    <Paper sx={{ display: "inline-block", padding: "0.5em 1em", margin: "0.5em 0" }}>
      <Typography variant="h6">Hacknet Summary</Typography>
      <StatsTable rows={rows} textAlign="left" />
    </Paper>
  );
}
