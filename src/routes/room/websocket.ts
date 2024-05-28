type Data = { type: string; [key: string]: any; };

export class DokojongWebSocket {
  private websocket: WebSocket;
  private handlers: { [event: string]: (data: Data) => any } = {};

  public constructor(
    url: string,
    onopen: (send: (data: Data) => void) => void,
    onclose: (reason: string) => void,
    onerror: () => void
  ) {
    this.websocket = new WebSocket(url);
    this.websocket.onopen = () => onopen(this.send.bind(this));
    this.websocket.onclose = (ev) => onclose(ev.reason);
    this.websocket.onerror = onerror;
    this.websocket.onmessage = (ev: MessageEvent<string>) => {
      let data: Data | undefined;
      try { data = JSON.parse(ev.data); } catch {}
      if (data === undefined || !(data.type in this.handlers)) {
        this.close();
      } else {
        this.handlers[data.type](data);
      }
    };
  }

  public send(data: Data) {
    this.websocket.send(JSON.stringify(data));
  }

  public close() {
    this.websocket.close();
  }

  public addHandler(type: string, handler: (data: Data) => any) {
    this.handlers[type] = handler;
  }

  public removeHandler(type: string) {
    delete this.handlers[type];
  }
}
