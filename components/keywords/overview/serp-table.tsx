import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SerpResult } from "@/lib/types";

interface SerpTableProps {
  results: SerpResult[];
}

export function SerpTable({ results }: SerpTableProps) {
  if (results.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>SERP Analysis</CardTitle>
        <CardDescription>Top ranking pages</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Position</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.position}>
                <TableCell className="font-medium">#{result.position}</TableCell>
                <TableCell>{result.domain}</TableCell>
                <TableCell className="max-w-xs truncate">{result.title}</TableCell>
                <TableCell className="max-w-sm truncate text-muted-foreground">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {result.url}
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
