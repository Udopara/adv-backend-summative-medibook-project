import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

const queues = new Map()

export function getWaitlistQueue(doctor_id) {
    const queueName = `doctor-${doctor_id}`

    if (!queues.has(queueName)){
        const queue = new Queue(queueName, {
            redisConnection
        })

        queues.set(queueName, queue);
    }

    return queues.get(queueName);
}