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
import { prettyUrl } from "./format";
import type { AuditLink } from "./audit-types";

interface LinksTabProps {
  links: AuditLink[];
}

/** Internal vs external — DataForSEO marks it on `type`. */
function linkKind(link: AuditLink): "internal" | "external" {
  return link.type === "external" ? "external" : "internal";
}

export function LinksTab({ links }: LinksTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Links</CardTitle>
        <CardDescription>
          {links.length > 0
            ? `${links.length.toLocaleString()} links found across the crawl`
            : "No links returned"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing to show here.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="hidden max-w-[12rem] md:table-cell">Anchor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Follow</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link, i) => {
                  const kind = linkKind(link);
                  const from = link.link_from ?? link.page_from;
                  const to = link.link_to;
                  return (
                    <TableRow key={`${from ?? "from"}-${to ?? "to"}-${i}`}>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {prettyUrl(from)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {to ? (
                          <a
                            href={to}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {prettyUrl(to)}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="hidden max-w-[12rem] truncate text-muted-foreground md:table-cell">
                        {link.text || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={kind === "external" ? "secondary" : "outline"}>
                          {kind === "external" ? "External" : "Internal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {link.is_broken ? (
                          <Badge variant="destructive">Broken</Badge>
                        ) : (
                          <Badge variant={link.dofollow ? "default" : "secondary"}>
                            {link.dofollow ? "Dofollow" : "Nofollow"}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
