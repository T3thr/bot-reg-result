// อิมพอร์ต mongoose มาใช้งาน
import mongoose from "mongoose"
// กำหนดฟังก์ชันในแบบ async สำหรับใช้เชื่อมต่อไปยังฐานข้อมูล
export default async function mongodbConnect() {
    try {
        mongoose.set("strictQuery", false);
        // เรียกเมธอด connect() เพื่อเชื่อมต่อฐานข้อมูล
        await mongoose.connect(process.env.MONGODB_URI)
        // กำหนด index ป้องกันไม่ให้ใส่ข้อมูลที่ซ้ำกันลงในฟิลด์ที่กำหนด
        await mongoose.connection.syncIndexes()
        console.log('Database Connected!')
    } catch (error) {
        console.error(error.message)
    }
}