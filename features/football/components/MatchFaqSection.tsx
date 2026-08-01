"use client";

import { Accordion, AccordionItem } from "@heroui/accordion";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";

import { useMatchFootballContext } from "@/features/football/hooks/useMatchFootballContext";

interface MatchFaqSectionProps {
  groupTags: string[] | undefined;
}

/** SEO-friendly FAQ block generated from fixture + league context. */
export function MatchFaqSection({ groupTags }: MatchFaqSectionProps) {
  const { data, isLoading, isError } = useMatchFootballContext(groupTags);

  if (isLoading) {
    return (
      <Card className="border border-default-100/50">
        <CardBody className="flex justify-center py-8">
          <Spinner size="sm" />
        </CardBody>
      </Card>
    );
  }

  if (isError || !data || data.faq.length === 0) return null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        type="application/ld+json"
      />
      <Card className="border border-default-100/50">
      <CardHeader>
        <h2 className="text-lg font-semibold">FAQ</h2>
      </CardHeader>
      <CardBody className="pt-0">
        <Accordion
          itemClasses={{
            title: "text-sm font-medium",
            content: "text-sm text-default-500",
          }}
          selectionMode="multiple"
        >
          {data.faq.map((item) => (
            <AccordionItem key={item.question} title={item.question}>
              {item.answer}
            </AccordionItem>
          ))}
        </Accordion>
      </CardBody>
    </Card>
    </>
  );
}
