import { writable } from "svelte/store";

export const Language = writable<string>("en");

//
export const ShowDiagramInfo = writable<boolean>(false);
