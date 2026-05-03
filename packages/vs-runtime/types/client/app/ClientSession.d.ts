import type { SimApi, SimContent } from "../../sim/core/SimApi.ts";
import type { ClientInputSource } from "../input/ClientInputSource.ts";
import type { ClientFrame } from "./ClientFrame.ts";
import type { ClientAction } from "./ClientActions.ts";
export declare class ClientSession {
    private readonly sim;
    private readonly renderPresenter;
    constructor(sim: SimApi, content?: SimContent);
    dispatch(action: ClientAction): ClientFrame;
    step(frameSeconds: number, input: Readonly<ClientInputSource>): ClientFrame;
    capture(): ClientFrame;
    getSim(): SimApi;
}
//# sourceMappingURL=ClientSession.d.ts.map