import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, prettyUrl } from "./format";
import type { Backlink } from "./backlinks-types";

interface BacklinksTableProps {
  backlinks: Backlink[];
}

export function BacklinksTable({ backlinks }: BacklinksTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Backlinks</CardTitle>
        <CardDescription>
          {backlinks.length > 0
            ? `Showing ${backlinks.length.toLocaleString()} individual backlinks`
            : "No backlinks found"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {backlinks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing to show here.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Page</TableHead>
                  <TableHead>Anchor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Target</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Rank</TableHead>
                  <TableHead className="hidden md:table-cell">First Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backlinks.map((b, i) => (
                  <TableRow key={`${b.url_from ?? "src"}-${i}`}>
                    <TableCell className="max-w-xs truncate">
                      {b.url_from ? (
                        <a
                          href={b.url_from}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                        >
                          {prettyUrl(b.url_from)}
                        </a>
                      ) : (
                        (b.domain_from ?? "—")
                      )}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                      {b.anchor || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={b.dofollow ? "default" : "secondary"}>
                          {b.dofollow ? "Dofollow" : "Nofollow"}
                        </Badge>
                        {b.is_broken && <Badge variant="destructive">Broken</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-xs truncate text-muted-foreground lg:table-cell">
                      {prettyUrl(b.url_to)}
                    </TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      {b.rank ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDate(b.first_seen)}
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
