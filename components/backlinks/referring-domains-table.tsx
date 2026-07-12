import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCount, formatDate } from "./format";
import type { ReferringDomain } from "./backlinks-types";

interface ReferringDomainsTableProps {
  domains: ReferringDomain[];
}

export function ReferringDomainsTable({ domains }: ReferringDomainsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Referring Domains</CardTitle>
        <CardDescription>
          {domains.length > 0
            ? `Top ${domains.length.toLocaleString()} domains linking to this target`
            : "No referring domains found"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {domains.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing to show here.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead className="text-right">Rank</TableHead>
                  <TableHead className="text-right">Backlinks</TableHead>
                  <TableHead className="text-right">Dofollow</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Spam</TableHead>
                  <TableHead className="hidden md:table-cell">First Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((d, i) => (
                  <TableRow key={`${d.domain ?? "domain"}-${i}`}>
                    <TableCell className="max-w-xs truncate font-medium">
                      {d.domain ? (
                        <a
                          href={`https://${d.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {d.domain}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">{d.rank ?? "-"}</TableCell>
                    <TableCell className="text-right">{formatCount(d.backlinks)}</TableCell>
                    <TableCell className="text-right">{formatCount(d.dofollow)}</TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      {d.backlinks_spam_score !== undefined ? `${d.backlinks_spam_score}%` : "-"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDate(d.first_seen)}
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
