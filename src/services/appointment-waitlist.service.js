import redis from "../config/redis.js";

export async function addAppointmentToWaitlist(doctor_id, appointment) {
  const waitlistKey = `waitlist:${doctor_id}`;
  await redis.rpush(waitlistKey, JSON.stringify(appointment));
}

export async function getNextAppointmentFromWaitlist(doctor_id){
   const waitlistKey = `waitlist:${doctor_id}`;
   const appointment = await redis.lindex(waitlistKey, 0)

   return appointment? JSON.parse(appointment): null;
} 

export async function removeNextAppointmentFromWaitlist(doctor_id){
    const waitlistKey = `waitlist:${doctor_id}`;
    await redis.ltrim(waitlistKey, 1, -1)
}