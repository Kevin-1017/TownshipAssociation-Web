import type { Metadata } from "next";
import LegalDoc from "../legal-doc";
import { AGREEMENT_DOC } from "../documents";

export const metadata: Metadata = {
  title: "用户服务协议",
  description: "广工胶己人（广东工业大学潮阳潮南校友会）网站的用户服务协议。",
};

export default function AgreementPage() {
  return <LegalDoc doc={AGREEMENT_DOC} />;
}
