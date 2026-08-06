import { getTranslations } from "next-intl/server";
import PageHero from "@/components/PageHero";
import InfoSection from "@/components/InfoSection";

export default async function Page() {
  const t = await getTranslations("Info");
  const h = await getTranslations("Home");
  return (
    <>
      <PageHero
        image="/images/phuquoc-town.jpg"
        eyebrow="GUIDE"
        title={t("title")}
        subtitle={h("infoDesc")}
      />
      <InfoSection />
    </>
  );
}
