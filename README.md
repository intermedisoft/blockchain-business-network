# DEPA Healthcare Blockchain Network

> A business network where members can grant/revoke access to their personal information to other members.

## Live Demo
สามารถเข้าถึงได้ที่ [EHRBlox.com](https://ehrblox.com) และติดต่อขอ Identity Card เพื่อเข้าใช้งานได้ สามารถอ่านรายละเอียดได้จาก [PHRBlox.com](https://www.phrblox.com)

## Business Network Deployment
เนื่องจากโปรเจคนี้เป็น Business Logic ทำงานอยู่บน Blockchain Network และการพัฒนาจะใช้ Hyperledger Composer เป็นเครื่องมือในการพัฒนา ดังนั้นสิ่งที่ต้องการในการทำงาน ผู้พัฒนาจะต้องเตรียมไว้ก่อนดังนี้

### Prerequisites

* **Working Blockchain Network** ผู้พัฒนาจะต้องเตรียม Blockchain Network ที่ทำงานได้ตามคู่มือนี้ [Installing pre-requisites](https://hyperledger.github.io/composer/latest/installing/installing-prereqs) และ [Installing the development environment](https://hyperledger.github.io/composer/latest/installing/development-tools) หรือถ้าหากต้องการที่ติดตั้ง Blockchain Network ที่มี 3 peers ให้ผู้พัฒนาสามารถศึกษาเพิ่มเติมได้จากโปรเจคของเราได้ที่ [DEPA Healthcare Blockchain Network](https://github.com/intermedisoft/blockchain-fabric-network)

### Deploy Business Network to Blockchain using Hyperledger Composer CLI

เมื่อผู้พัฒนาได้ติดตั้งโปรแกรมที่ต้องการเสร็จแล้ว ผู้พัฒนาสามารถรันคำสั่ง `deploy_bna.sh` สำหรับการรันครั้งแรก โดยจะได้ Identity Card ที่ชื่อว่า `admin@my-network` ไว้ใช้งานใน Hyperledger Composer CLI และโปรแกรมเราจะถูกทำงาน

สำหรับการอัพเดตครั้งต่อไป ให้รันสคริปต์ `update_bna.sh` เพื่อเป็นการ Update Chaincode ที่ถูกรันอยู่แล้ว แทนการสร้างใหม่ ซึ่งตัว Blockchain Network จะไม่รองรับ

### Create Blockchain-enabled Applications with Business Logic

เมื่อ Business Network ถูก Deploy แล้ว ผู้พัฒนาสามารถเรียกใช้งาน Business Logic นี้ได้ผ่าน 2 ช่องทางหลัก ๆ ได้แก่

* [Hyperledger Fabric SDK](http://hyperledger-fabric.readthedocs.io/en/release/fabric-sdks.html) 
* [Composer REST Server](https://hyperledger.github.io/composer/latest/integrating/getting-started-rest-api.html)

โดยตาม Scenarios ที่เราได้วางไว้ จะเป็นการพัฒนา Application โดยผ่าน Composer REST Server ซึ่งโปรแกรมดังกล่าวจะอ่าน Business Network Definition และสร้างออกมาเป็น REST API ให้โดยอัตโนมัติ นอกจากนี้ Composer REST Server ยังจัดการเรื่องของ Identity ให้กับแต่ละ Application ที่ติดต่อเข้ามาด้วย ซึ่งหากใช้ Hyperledger Fabric SDK อาจจะต้องจัดการเรื่องของ Identiy ของผู้ใช้ดังกล่าวเอง

## Business Network Definition

โครงสร้างข้อมูลนำมาจาก PHR Dataset โดย NECTEC ซึ่งนำมาปรับปรุงเพิ่มเติมให้เข้ากับการทำงานร่วมกับ Blockchain และ Scenarios ที่ตั้งไว้

ข้อมูลประกอบไปด้วยส่วนของ
* **ข้อมูลเปิดเผย** `com.depa.blockchain.core.*` ชุดข้อมูลในส่วนนี้ เป็นชุดข้อมูลที่สามารถเข้าถึงได้โดยไม่ต้องใช้สิทธิ์จาก Participants ที่กำหนดไว้ในแพ็คเกจนี้
* **ข้อมูลปกปิด** `com.depa.blockchain.assets.*` ชุดข้อมูลในส่วนนี้ เป็นชุดข้อมูลที่หากจะเข้าถึง จำเป็นต้องได้รับสิทธิ์จากเจ้าของข้อมูล ซึ่งหลัก ๆ แล้วข้อมูลภายในแพ็คเกจนี้จะมีเจ้าของคือคนไข้ (`com.depa.blockchain.core.Patient`) โดยสถานพยาบาล (`com.depa.blockchain.core.HealthCareProvider`) จำเป็นจะต้องขอสิทธิ์การเข้าถึงข้อมูลก่อน

### Permission mechanism in this business network definition

ในเบื้องต้น การออกแบบระบบจะไม่อนุญาตผู้ใช้ที่ถือ Identity ของ HealthCareProvider (HCP) เข้าถึงข้อมูลใด ๆ ของผู้ป่วยได้ หากว่าไม่ได้รับอนุญาตจากการเข้าถึงจากผู้ป่วยก่อน ดังนั้นการที่ HCP ต้องการจะเข้าถึงข้อมูลของผู้ป่วย จำเป็นจะต้องมีการขออนุญาตด้วยการออก PermissionTransaction มาก่อน เพื่อเป็นการประกาศว่าต้องการที่จะเข้าถึงข้อมูลผู้ป่วย และผู้ป่วยจะต้องมีการตอบรับผ่านทาง Identity ของผู้ป่วยเอง ว่าต้องการที่จะอนุญาตให้เข้าถึงได้หรือไม่
โดยรายละเอียดของการส่ง PermissionTransaction มีดังต่อไปนี้ 

```
REST API Endpoint: POST /PermissionTransaction
Relevant asset: PermissionLog
```
การเข้าถึงข้อมูลคนไข้ซึ่งอยู่ใน namespace com.depa.blockchain.assets ทั้งหมด จำเป็นจะต้องมีการขออนุญาตจากคนไข้ก่อน โดยมีกระบวนการขออนุญาต ให้สิทธิ์ และถอนคำอนุญาตตามรายละเอียดที่จะกล่าวถึงต่อไป
หากโรงพยาบาลไม่ขออนุญาต ด้วยกฏการเข้าถึงข้อมูลที่อยู่ภายใน Blockchain Network จะไม่อนุญาตให้โรงพยาบาลใด ๆ เข้าถึงข้อมูลได้โดยเด็ดขาด

#### Permission Request – by HealthCareProvider
เมื่อโรงพยาบาลต้องการที่จะเข้าถึงข้อมูลของคนไข้ โรงพยาบาลจะต้องส่ง Transaction REQUEST มาในระบบ Blockchain โดยบอกว่าต้องการเข้าถึงข้อมูลของใคร ดังนี้
```
{
 "$class": "com.depa.blockchain.core.PermissionTransaction",
 "permissionType": "REQUEST",
 "patient": "resource:com.depa.blockchain.core.Patient#patientId:0001",
 "healthCareProvider": "resource:com.depa.blockchain.core.HealthCareProvider#healthCareProviderId:0001",
 "transactionId": "d2f4672f-1fa7-4fea-b820-d79be22cb602",
 "timestamp": "2017-09-20T09:16:54.800Z"
}
```

หลังจากนั้น ระบบจะบันทึกข้อมูลการร้องขอ และทำการส่ง Event ที่ชื่อว่า PermissionRequest ออกไป โดยใน Event จะระบุถึง ID ของคนไข้และโรงพยาบาลที่ทำการขอข้อมูล

#### Permission Grant – by Patient

เมื่อ Application ได้รับ Event PermissionRequest แล้ว Application จะดึงข้อมูลออกมาให้ผู้ใช้สามารถพิจารณาการร้องขอได้ โดยหากผู้ใช้อนุญาต ผู้ใช้จะส่ง Transaction มาอนุญาตดังนี้
```
{
 "$class": "com.depa.blockchain.core.PermissionTransaction",
 "permissionType": "GRANT",
 "patient": "resource:com.depa.blockchain.core.Patient#patientId:0001",
 "healthCareProvider": "resource:com.depa.blockchain.core.HealthCareProvider#healthCareProviderId:0001",
 "transactionId": "c456e8ab-aef3-44de-9fc3-b1e697538770",
 "timestamp": "2017-09-20T09:17:50.128Z"
}
```
โดยระบบจะบันทึกข้อมูลการตอบรับ ส่ง Event ที่ชื่อว่า PermissionGranted ออกไป และทำการปรับปรุงข้อมูลของคนไข้ ให้ถูกอนุญาตให้เข้าถึงได้โดย healthCareProviderId:0001 ทั้งหมดไปพร้อมกันด้วย

#### Permission Deny – by Patient
หากผู้ใช้ปฏิเสธ ผู้ใช้จะส่ง Transaction ออกมาเพื่อที่จะบอกปฏิเสธในคราวนั้น ๆ ด้วย Message ดังนี้ และระบบจะทำการบันทึกการปฏิเสธ และส่ง Event ที่ชื่อว่า PermissionDenied ออกไปด้วย
```
{
 "$class": "com.depa.blockchain.core.PermissionTransaction",
 "permissionType": "DENY",
 "patient": "resource:com.depa.blockchain.core.Patient#patientId:0001",
 "healthCareProvider": "resource:com.depa.blockchain.core.HealthCareProvider#healthCareProviderId:0001",
 "transactionId": "c456e8ab-aef3-44de-9fc3-b1e697538770",
 "timestamp": "2017-09-20T09:17:50.128Z"
}
```

#### Permission Revoke – by Patient

เมื่อผู้ใช้ต้องการเพิกถอนสิทธิ์ ผู้ใช้สามารถที่จะส่ง Transaction REVOKE เพื่อถอนการเข้าถึงข้อมูลของโรงพยาบาลที่ระบุไว้ใน Transaction นี้ด้วย
```
{
 "$class": "com.depa.blockchain.core.PermissionTransaction",
 "permissionType": "REVOKE",
 "patient": "resource:com.depa.blockchain.core.Patient#patientId:0001",
 "healthCareProvider": "resource:com.depa.blockchain.core.HealthCareProvider#healthCareProviderId:0001",
 "transactionId": "c456e8ab-aef3-44de-9fc3-b1e697538770",
 "timestamp": "2017-09-20T09:17:50.128Z"
}
```
โดยระบบจะทำการบันทึกข้อมูลการเพิกถอน ส่ง Event ที่ชื่อว่า PermissionRevoked และทำการปรับปรุงข้อมูลของคนไข้ ไม่ให้เข้าถึงได้โดย healthCareProviderId:0001 ได้
