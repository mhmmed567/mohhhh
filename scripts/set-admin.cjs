const fs = require("fs");
const { cert, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log("اكتب الإيميل بعد الأمر");
    console.log("مثال: node scripts/set-admin.cjs example@gmail.com");
    process.exit(1);
  }

  try {
    const user = await getAuth().getUserByEmail(email);

    await getAuth().setCustomUserClaims(user.uid, {
      role: "admin",
    });

    console.log("");
    console.log("✅ تم إعطاء الحساب صلاحية ADMIN");
    console.log("الإيميل:", user.email);
    console.log("UID:", user.uid);
    console.log("");
    console.log("الآن سجّل خروج من الموقع ثم ادخل مرة ثانية.");
  } catch (error) {
    console.error("");
    console.error("❌ حدث خطأ:");
    console.error(error.message);
  }
}

main();