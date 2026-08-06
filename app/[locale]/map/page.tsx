import { getTranslations } from "next-intl/server";
import PageHero from "@/components/PageHero";
import MapWorkspace from "@/components/MapWorkspace";

export default async function Page() {
  const t = await getTranslations("Map");
  return (
    <>
      <PageHero
        image="/images/phuquoc-cablecar.jpg"
        eyebrow="EXPLORE"
        title={t("title")}
        subtitle={t("hint")}
      />
      <MapWorkspace />
    </>
  );
}
