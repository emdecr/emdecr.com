"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type TextNode = {
  text: string;
  type: "text";
};

type LinkNode = {
  type: "link";
  url: string;
  children: RichTextNode[];
};

type RichTextNode = TextNode | LinkNode;

type Block = {
  type: "heading" | "paragraph";
  level?: number;
  children: RichTextNode[];
};

type HomeContent = {
  id: number;
  Title: string;
  Body: Block[];
};

export default function HomePage() {
  const [content, setContent] = useState<HomeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomeContent = async () => {
      try {
        const res = await axios.get("http://localhost:1337/api/home");
        const { id, Title, Body } = res.data.data;
        setContent({ id, Title, Body });
      } catch (err) {
        setError("Failed to fetch content.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeContent();
  }, []);

  const renderChildren = (nodes: RichTextNode[]) => {
    return nodes.map((node, index) => {
      if (node.type === "text") {
        return <span key={index}>{node.text}</span>;
      }

      if (node.type === "link") {
        return (
          <a
            key={index}
            href={node.url}
            className="text-blue-600 underline hover:text-blue-800"
          >
            {renderChildren(node.children)}
          </a>
        );
      }

      return null;
    });
  };

  const renderBody = (body: Block[]) => {
    return body.map((block, index) => {
      switch (block.type) {
        case "heading":
          const HeadingTag = `h${block.level || 1}` as keyof JSX.IntrinsicElements;
          return (
            <HeadingTag key={index} className="font-bold text-2xl mb-4">
              {renderChildren(block.children)}
            </HeadingTag>
          );

        case "paragraph":
          return (
            <p key={index} className="mb-4 text-base">
              {renderChildren(block.children)}
            </p>
          );

        default:
          return null;
      }
    });
  };

  if (loading) return <p>Loading...</p>;
  if (error || !content) return <p>{error || "No content found"}</p>;

  return (
    <main className="p-8 max-w-2xl mx-auto">
      {renderBody(content.Body)}
    </main>
  );
}
