import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TechCategory } from "./domain-types";

interface TechStackProps {
  technologies: TechCategory[];
}

export function TechStack({ technologies }: TechStackProps) {
  const total = technologies.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tech Stack</CardTitle>
        <CardDescription>
          {total > 0
            ? `${total.toLocaleString()} technologies across ${technologies.length} categories`
            : "No technologies detected"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {technologies.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing to show here.</p>
        ) : (
          <div className="space-y-6">
            {technologies.map((cat) => (
              <div key={cat.category} className="space-y-2">
                <h3 className="text-sm font-medium capitalize text-muted-foreground">
                  {cat.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((tech) => (
                    <Badge key={tech} variant="secondary" className="font-normal">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
