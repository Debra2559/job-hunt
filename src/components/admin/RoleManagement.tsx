import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Search, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserWithRole {
  id: string;
  user_id: string;
  display_name: string | null;
  college: string | null;
  role: 'super_admin' | 'admin' | 'user' | null;
  created_at: string;
}

export function RoleManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadUsersWithRoles();
  }, []);

  const loadUsersWithRoles = async () => {
    try {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          display_name: profile.display_name,
          college: profile.college,
          role: userRole?.role as UserWithRole['role'] || null,
          created_at: profile.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users with roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    setUpdating(userId);
    try {
      if (isCurrentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;
        toast.success('已撤销管理员权限');
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: 'admin',
          }, {
            onConflict: 'user_id,role'
          });

        if (error) throw error;
        toast.success('已设为管理员');
      }

      loadUsersWithRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('操作失败');
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.college?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: UserWithRole['role']) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">超级管理员</Badge>;
      case 'admin':
        return <Badge variant="default">管理员</Badge>;
      default:
        return <Badge variant="secondary">普通用户</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              权限管理
            </CardTitle>
            <CardDescription>管理用户角色和权限（仅超级管理员可用）</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>学院</TableHead>
                  <TableHead>当前角色</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      暂无用户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.display_name || '未设置'}
                      </TableCell>
                      <TableCell>{user.college || '-'}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role !== 'super_admin' && (
                          <Button
                            size="sm"
                            variant={user.role === 'admin' ? 'destructive' : 'default'}
                            onClick={() => handleSetAdmin(user.user_id, user.role === 'admin')}
                            disabled={updating === user.user_id}
                          >
                            {updating === user.user_id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : user.role === 'admin' ? (
                              <>
                                <UserMinus className="w-4 h-4 mr-1" />
                                撤销
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 mr-1" />
                                设为管理员
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
