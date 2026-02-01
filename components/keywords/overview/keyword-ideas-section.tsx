import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getKDColor } from "@/lib/keyword-utils";
import type { KeywordIdeaWithMeta } from "@/lib/api";

interface KeywordIdeasSectionProps {
  ideas: KeywordIdeaWithMeta[];
}

function KeywordIdeasTable({ ideas }: { ideas: KeywordIdeaWithMeta[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Keyword</TableHead>
          <TableHead className="text-right">Volume</TableHead>
          <TableHead className="text-right">KD</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ideas.slice(0, 10).map((idea) => (
          <TableRow key={idea.keyword}>
            <TableCell className="font-medium">{idea.keyword}</TableCell>
            <TableCell className="text-right">{idea.volume.toLocaleString()}</TableCell>
            <TableCell className="text-right">
              <span className={getKDColor(idea.kd)}>{idea.kd}%</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function KeywordIdeasSection({ ideas }: KeywordIdeasSectionProps) {
  if (!ideas || ideas.length === 0) return null;

  const variations = ideas.filter((idea) => idea.type !== "question");
  const questions = ideas.filter((idea) => idea.type === "question");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Keyword Variations</CardTitle>
          <CardDescription>Related keyword ideas</CardDescription>
        </CardHeader>
        <CardContent>
          <KeywordIdeasTable ideas={variations} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>Question-based keywords</CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length > 0 ? (
            <KeywordIdeasTable ideas={questions} />
          ) : (
            <p className="text-sm text-muted-foreground">No question-based keywords found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
