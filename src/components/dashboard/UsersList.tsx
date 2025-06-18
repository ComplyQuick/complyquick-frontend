import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, CheckCircle, Clock, AlertCircle } from "lucide-react";
import {  UsersListProps } from "@/types/UsersList";

const UsersList = ({ users, title = "Users" }: UsersListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-medium">
                        {user.coursesCompleted}/{user.totalCourses}
                      </span>
                      <p className="text-xs text-muted-foreground">Courses</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.lastActivity === "Completed" ? (
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-green-100 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-medium">Completed</span>
                        <p className="text-xs text-muted-foreground">
                          Courses finished
                        </p>
                      </div>
                    </div>
                  ) : user.lastActivity === "In Progress" ? (
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-medium">In Progress</span>
                        <p className="text-xs text-muted-foreground">
                          Currently learning
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-gray-100 text-gray-600">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-medium">Not Started</span>
                        <p className="text-xs text-muted-foreground">
                          No courses started
                        </p>
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UsersList;
