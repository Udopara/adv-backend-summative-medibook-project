import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

class Logger {
  static filePath = "./logs/audit.log";

  static async #write(event, data) {
    const entry = {
      event,
      timestamp: new Date().toISOString(),
      ...data,
    };
    await mkdir(dirname(this.filePath), { recursive: true });
    await appendFile(this.filePath, `${JSON.stringify(entry)}\n`, "utf8");
  }

  static async logBooking(data) {
    await this.#write("booking", data);
  }

  static async logCancellation(data) {
    await this.#write("cancellation", data);
  }

  static async logNotification(data) {
    const payload = typeof data === "string" ? { message: data } : data;
    await this.#write("email notification", payload);
  }
}

export default Logger;
