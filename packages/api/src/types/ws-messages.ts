export type ClientMessage =
	| {
			type: "subscribe";
			content: {
				events: string[];
				authorization: string;
			};
	  }
	| {
			type: "watch_device_auth";
			content: {
				userCode: string;
				deviceCode: string;
			};
	  };

export type SubscribeMessage = Extract<ClientMessage, { type: "subscribe" }>;
export type WatchDeviceAuthMessage = Extract<
	ClientMessage,
	{ type: "watch_device_auth" }
>;
