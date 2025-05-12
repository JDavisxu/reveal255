import { Idl } from "@coral-xyz/anchor";
import rawIdl from "./reveal255.json"; // your actual IDL file

export const IDL = rawIdl as unknown as Idl;
export type Reveal255 = typeof IDL;
