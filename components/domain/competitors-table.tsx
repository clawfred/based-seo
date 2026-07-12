import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInt, formatCompact } from "./format";
import type { CompetitorRow } from "./domain-types";

interface CompetitorsTableProps {
  competitors: CompetitorRow[];
}

export function CompetitorsTable({ competitors }: CompetitorsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitors</CardTitle>
        <CardDescription>
          {competitors.length > 0
            ? `Top ${competitors.length.toLocaleString()} domains competing for the same keywords`
            : "No competing domains found"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {competitors.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing to show here.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead className="text-right">Common Keywords</TableHead>
                  <TableHead className="text-right">Organic Keywords</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Organic Traffic</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Avg. Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((c, i) => (
                  <TableRow key={`${c.domain ?? "domain"}-${i}`}>
                    <TableCell className="max-w-xs truncate font-medium">
                      {c.domain ? (
                        <a
                          href={`https://${c.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {c.domain}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatInt(c.commonKeywords)}</TableCell>
                    <TableCell className="text-right">{formatCompact(c.organicKeywords)}</TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      {formatCompact(c.organicTraffic)}
                    </TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      {c.avgPosition !== undefined ? c.avgPosition.toFixed(1) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
