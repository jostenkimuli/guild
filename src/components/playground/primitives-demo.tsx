"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { mockMembers } from "@/lib/playground/mock";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function PrimitivesDemo() {
  return (
    <div className="space-y-10">
      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-2">
          {(["default", "outline", "secondary", "ghost", "destructive", "link"] as const).map(
            (variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ),
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["xs", "sm", "default", "lg"] as const).map((size) => (
            <Button key={size} size={size}>
              {size}
            </Button>
          ))}
          <Button size="icon" aria-label="Add">
            <PlusIcon />
          </Button>
          <Button size="sm" className="gap-1">
            Menu <ChevronDownIcon data-icon="inline-end" />
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          {(["default", "secondary", "destructive", "outline", "ghost"] as const).map(
            (variant) => (
              <Badge key={variant} variant={variant}>
                {variant}
              </Badge>
            ),
          )}
        </div>
      </Section>

      <Section title="Avatar">
        <div className="flex flex-wrap items-center gap-3">
          {mockMembers.slice(0, 4).map((member) => (
            <div key={member.id} className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>
                  {member.display_name
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{member.display_name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Forms">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pg-name">Display name</Label>
              <Input id="pg-name" placeholder="Ama Serwaa" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pg-email">Email</Label>
              <Input id="pg-email" type="email" placeholder="ama@sunrise.dev" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pg-bio">Bio</Label>
              <Textarea id="pg-bio" rows={3} placeholder="Tell learners about yourself…" />
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Input surface contexts</CardTitle>
              <CardDescription>
                Inputs live on cards, muted rows and raw backgrounds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="On a plain background" disabled />
              <div className="rounded-lg border bg-muted/40 p-2">
                <Input placeholder="Inside a muted box" />
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="rounded-lg border p-4">
            Tabs content rendered per active trigger.
          </TabsContent>
          <TabsContent value="activities" className="rounded-lg border p-4">
            Activity tab content.
          </TabsContent>
          <TabsContent value="assessments" className="rounded-lg border p-4">
            Assessment tab content.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Table + dropdown menus">
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.display_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{member.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Manage <ChevronDownIcon data-icon="inline-end" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{member.display_name}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Assign role</DropdownMenuItem>
                          <DropdownMenuItem>Invite again</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive">Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Section>

      <Section title="Dialogs & sheets">
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm space edit</DialogTitle>
                <DialogDescription>
                  Approving publishes the change to every member of this space.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Reject</Button>
                <Button>Approve</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open sheet</Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Lesson quick-edit</SheetTitle>
                <SheetDescription>
                  A slide-over panel for lightweight editing without losing context.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </Section>

      <Section title="Loading states">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Cards pair with skeletons while server data streams in.
            </CardContent>
          </Card>
        </div>
      </Section>

      <Separator />

      <p className="text-sm text-muted-foreground">
        End of primitives kitchen sink. Mock members rendered above come from{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          src/lib/playground/mock.ts
        </code>
        .
      </p>
    </div>
  );
}