import { getTranslations } from "next-intl/server";
import PageHero from "@/components/PageHero";
import FlightPanel from "@/components/FlightPanel";

export default async function Page() {
  const t = await getTranslations("Flights");
  return (
    <>
      <PageHero
        image="/images/phuquoc-sunset.jpg"
        eyebrow="FLIGHTS"
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <FlightPanel />
    </>
  );
}
