import { PublicKey } from "@solana/web3.js";
import { createContext } from "react";

export const UserContext = createContext<PublicKey | null>(null);