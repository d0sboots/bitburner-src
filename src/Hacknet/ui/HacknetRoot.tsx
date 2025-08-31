import React, { useState, useMemo, useCallback, useRef } from "react";

import { GeneralInfo } from "./GeneralInfo";
import { HacknetNodeElem } from "./HacknetNodeElem";
import { HacknetServerElem } from "./HacknetServerElem";
import { HacknetNode } from "../HacknetNode";
import { HacknetServer } from "../HacknetServer";
import { HashUpgradeModal } from "./HashUpgradeModal";
import { MultiplierButtons } from "./MultiplierButtons";
import { PlayerInfo } from "./PlayerInfo";
import { PurchaseButton } from "./PurchaseButton";
import { PurchaseMultipliers } from "../data/Constants";

import {
  getCostOfNextHacknetNode,
  getCostOfNextHacknetServer,
  hasHacknetServers,
  purchaseHacknet,
} from "../HacknetHelpers";

import { Player } from "@player";
import { GetServer } from "../../Server/AllServers";

import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import { Box } from "@mui/material";
import { useCycleRerender } from "../../ui/React/hooks";

/** Root React Component for the Hacknet Node UI */
export function HacknetRoot(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const rerender = useCycleRerender();
  const [purchaseMultiplier, setPurchaseMultiplier] = useState<number | "MAX">(PurchaseMultipliers.x1);

  const hasServers = hasHacknetServers();

  const handlePurchaseButtonClick = useCallback(() => {
    purchaseHacknet();
    rerender();
  }, [rerender]);

  // Cost to purchase a new Hacknet Node
  let purchaseCost;
  if (hasServers) {
    purchaseCost = getCostOfNextHacknetServer();
  } else {
    purchaseCost = getCostOfNextHacknetNode();
  }

  // onClick event handlers for purchase multiplier buttons
  const purchaseMultiplierOnClicks = useMemo(
    () => [
      () => setPurchaseMultiplier(PurchaseMultipliers.x1),
      () => setPurchaseMultiplier(PurchaseMultipliers.x5),
      () => setPurchaseMultiplier(PurchaseMultipliers.x10),
      () => setPurchaseMultiplier(PurchaseMultipliers.MAX),
    ],
    [setPurchaseMultiplier],
  );

  // Because hacknetNodes is mutated, it doesn't play nicely with useMemo. We
  // keep a copy of it here that we can use to see if the contents have
  // changed. This doesn't check for deep changes; if the nodes themselves
  // change, the underlying UI components are expected to deal with that.
  const nodesRef: React.Ref<[(string | HacknetNode)[]]> = useRef([[]]);
  const notNull = nodesRef.current as [(string | HacknetNode)[]];
  const oldNodes = notNull[0];
  if (oldNodes.length !== Player.hacknetNodes.length || !oldNodes.every((v, i) => v === Player.hacknetNodes[i])) {
    notNull[0] = [...Player.hacknetNodes];
  }
  const newNodes = notNull[0];

  // HacknetNode components
  const makeNodes = useCallback(
    () =>
      newNodes.map((node) => {
        if (hasServers) {
          if (node instanceof HacknetNode) throw new Error("node was hacknet node"); // should never happen
          const hserver = GetServer(node);
          if (hserver == null) {
            throw new Error(`Could not find Hacknet Server object in AllServers map for IP: ${node}`);
          }
          if (!(hserver instanceof HacknetServer)) throw new Error("node was not hacknet server"); // should never happen
          return (
            <HacknetServerElem
              key={hserver.hostname}
              node={hserver}
              purchaseMultiplier={purchaseMultiplier}
              rerender={rerender}
            />
          );
        } else {
          if (typeof node === "string") throw new Error("node was ip string"); // should never happen
          return (
            <HacknetNodeElem key={node.name} node={node} purchaseMultiplier={purchaseMultiplier} rerender={rerender} />
          );
        }
      }),
    [newNodes, purchaseMultiplier, rerender, hasServers],
  );

  return (
    <>
      {useMemo(
        () => (
          <>
            <Typography variant="h4">Hacknet {hasServers ? "Servers" : "Nodes"}</Typography>
            <GeneralInfo hasHacknetServers={hasServers} />

            <br />
          </>
        ),
        [hasServers],
      )}

      {useMemo(
        () => (
          <PlayerInfo />
        ),
        [],
      )}

      <br />

      {hasServers && (
        <>
          {/* 
          The usage of focusRipple in this button is intentional. Without it, after closing the modal by pressing the
          Esc button, this button has a weird ripple effect (only on Chrome).
          The documentation says that focusRipple is false by default, but I have to explicitly set it to false to fix
          this weird ripple effect.
          */}
          <Button focusRipple={false} onClick={() => setOpen(true)}>
            Spend Hashes on Upgrades
          </Button>
          <br />
        </>
      )}

      {useMemo(
        () => (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <PurchaseButton cost={purchaseCost} multiplier={purchaseMultiplier} onClick={handlePurchaseButtonClick} />
            </Grid>
            <Grid item xs={6}>
              <MultiplierButtons onClicks={purchaseMultiplierOnClicks} purchaseMultiplier={purchaseMultiplier} />
            </Grid>
          </Grid>
        ),
        [purchaseCost, purchaseMultiplier, purchaseMultiplierOnClicks, handlePurchaseButtonClick],
      )}

      {useMemo(
        () => (
          <Box sx={{ display: "grid", width: "100%", gridTemplateColumns: "repeat(auto-fit, 30em)" }}>
            {makeNodes()}
          </Box>
        ),
        [makeNodes],
      )}
      <HashUpgradeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
