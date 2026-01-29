const phonenumber = "010-1234-5678";
const regex = /^\d{3}-\d{3,4}-\d{4}$/;

// 1. 형식 검증 (test)
if (regex.test(phonenumber)) {
  console.log("유효한 전화번호 형식입니다.");
} else {
  console.log("유효하지 않은 전화번호 형식입니다.");
}
