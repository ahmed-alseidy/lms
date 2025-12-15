"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateCourseCodes, getCourseCodes } from "@/lib/course-codes";
import { attempt } from "@/lib/utils";

export default function CourseCodesPage() {
  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();
  const params = useParams();
  const courseId = Number(params.courseId);

  const { data: codes, isLoading } = useQuery({
    queryKey: ["course-codes", courseId],
    queryFn: async () => {
      const [data, error] = await attempt(getCourseCodes(courseId));
      if (error) {
        toast.error("Failed to fetch codes");
        return;
      }
      return data;
    },
  });

  const { mutate: generateCodes, isPending } = useMutation({
    mutationFn: async (quantity: number) => {
      const [data, error] = await attempt(
        generateCourseCodes(courseId, quantity)
      );
      if (error) {
        toast.error("Failed to generate codes");
        return;
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Codes generated successfully");
      queryClient.invalidateQueries({ queryKey: ["course-codes", courseId] });
    },
    onError: () => {
      toast.error("Failed to generate codes");
    },
  });

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="text-muted-foreground h-10 w-10 animate-spin" />
      </div>
    );

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-2xl font-bold">Course Codes</h1>
        <div className="flex gap-4">
          <Input
            className="w-32"
            min={1}
            onChange={(e) => setQuantity(Number(e.target.value))}
            type="number"
            value={quantity}
          />
          <Button disabled={isPending} onClick={() => generateCodes(quantity)}>
            Generate Codes
          </Button>
        </div>
      </div>

      <Table className="rounded-lg border">
        <TableHeader>
          <TableRow className="bg-primary/5">
            <TableHead>Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Used By</TableHead>
            <TableHead>Used At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {codes?.data.map((code) => (
            <TableRow key={code.id}>
              <TableCell>{code.code}</TableCell>
              <TableCell>{code.isUsed ? "Used" : "Available"}</TableCell>
              <TableCell>{code.student?.name || "-"}</TableCell>
              <TableCell>
                {code.usedAt ? new Date(code.usedAt).toLocaleDateString() : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
