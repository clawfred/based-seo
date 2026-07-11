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
import { num, str, type Row } from "../geo-extract";
import { formatCount, formatPercent } from "../geo-format";

interface BrandLeaderboardProps {
  keyword: string;
  target: string;
  brands: Row[];
}

const NAME_KEYS = ["brand", "name", "target", "domain", "title"];
const COUNT_KEYS = ["mentions_count", "mentions", "count", "total_mentions"];
const SHARE_KEYS = ["mention_rate", "share", "share_of_voice", "percentage", "visibility"];

export function BrandLeaderboard({ keyword, target, brands }: BrandLeaderboardProps) {
  const targetKey = target.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitor leaderboard</CardTitle>
        <CardDescription>
          {brands.length > 0
            ? `Brands most mentioned by AI for “${keyword}”`
            : "No brand mentions found for this topic"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {brands.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing to show here.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-right">#</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">Mentions</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((row, i) => {
                  const name = str(row, NAME_KEYS) ?? "—";
                  const isYou = name.toLowerCase().includes(targetKey) && targetKey.length > 0;
                  return (
                    <TableRow key={`${name}-${i}`} className={isYou ? "bg-indigo-500/5" : undefined}>
                      <TableCell className="text-right text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="max-w-xs truncate font-medium">
                        {name}
                        {isYou && (
                          <Badge variant="default" className="ml-2 align-middle">
                            You
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatCount(num(row, COUNT_KEYS))}</TableCell>
                      <TableCell className="hidden text-right md:table-cell">
                        {formatPercent(num(row, SHARE_KEYS))}
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
