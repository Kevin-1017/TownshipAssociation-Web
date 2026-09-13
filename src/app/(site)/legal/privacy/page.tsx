import type { Metadata } from "next";
import LegalDoc from "../legal-doc";
import { PRIVACY_DOC } from "../documents";

export const metadata: Metadata = {
  title: "隐私保护指引",
  description: "广工胶己人（广东工业大学潮阳潮南校友会）网站的隐私保护指引。",
};

export default function PrivacyPage() {
  return <LegalDoc doc={PRIVACY_DOC} />;
}
