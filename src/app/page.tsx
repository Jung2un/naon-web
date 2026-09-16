import { redirect } from "next/navigation";

/** 웹은 관리 화면이다. 진입점은 대시보드뿐이고, 미로그인은 proxy가 /login으로 돌린다. */
export default function Home() {
  redirect("/dashboard");
}
