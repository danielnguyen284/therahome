"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import {
	LayoutDashboard,
	Dumbbell,
	Calendar,
	Users,
	Smartphone,
	Brain,
	BookOpen,
	Accessibility,
	MessageSquare,
	Star,
	Film,
	Package,
	LogOut,
	Menu,
	X,
	QrCode,
	Library,
	Bell,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

const menuItems = [
	{ icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
	{ icon: Dumbbell, label: "Bài tập", href: "/admin/exercises" },
	{ icon: Calendar, label: "Workout Plans", href: "/admin/workout-plans" },
	{ icon: Users, label: "Users", href: "/admin/users" },
	{ icon: Smartphone, label: "Thiết bị", href: "/admin/devices" },
	{ icon: Brain, label: "AI Prompts", href: "/admin/ai-prompts" },
	{ icon: BookOpen, label: "Knowledge Base", href: "/admin/knowledge" },
	{ icon: Library, label: "Thư viện", href: "/admin/library" },
	{ icon: Accessibility, label: "Tư thế", href: "/admin/postures" },
	{ icon: MessageSquare, label: "Motivation", href: "/admin/motivations" },
	{ icon: Bell, label: "Thông báo", href: "/admin/notifications" },
	{ icon: Film, label: "Videos", href: "/admin/videos" },
	{ icon: Film, label: "Videos Cá Nhân", href: "/admin/personalized-videos" },
	// { icon: Key, label: 'Activation Codes', href: '/admin/codes' },
	{ icon: QrCode, label: "Mã Sản Phẩm", href: "/admin/product-instances" },
	{ icon: Package, label: "Sản Phẩm", href: "/admin/products" },
	{ icon: Star, label: "Đánh Giá", href: "/admin/product-reviews" },
];

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const [loading, setLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [userEmail, setUserEmail] = useState("");

	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		try {
			const user = api.getUser();
			const token = api.isLoggedIn();

			if (!token || !user) {
				router.push("/login");
				return;
			}

			if (user.role !== "admin") {
				api.clearToken();
				router.push("/login");
				return;
			}

			setUserEmail(user.email || "");
			setLoading(false);
		} catch (error) {
			console.error("Auth check error:", error);
			router.push("/login");
		}
	};

	const handleLogout = async () => {
		api.clearToken();
		router.push("/login");
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50">
			{/* Sidebar */}
			<aside
				className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
			>
				<div className="h-full flex flex-col">
					{/* Logo */}
					<div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
						<div className="flex items-center">
							<Image
								src="/logo.png"
								alt="TheraHome"
								width={140}
								height={44}
								className="object-contain h-10 w-auto"
							/>
						</div>
						<button
							onClick={() => setSidebarOpen(false)}
							className="lg:hidden text-slate-600 hover:text-slate-900"
						>
							<X size={24} />
						</button>
					</div>

					{/* Menu */}
					<nav className="flex-1 overflow-y-auto p-4">
						<ul className="space-y-1">
							{menuItems.map((item) => {
								const Icon = item.icon;
								const isActive = pathname === item.href;

								return (
									<li key={item.href}>
										<Link
											href={item.href}
											onClick={() => setSidebarOpen(false)}
											className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
												isActive
													? "bg-blue-50 text-blue-600"
													: "text-slate-700 hover:bg-slate-50"
											}`}
										>
											<Icon size={20} />
											{item.label}
										</Link>
									</li>
								);
							})}
						</ul>
					</nav>

					{/* User */}
					<div className="p-4 border-t border-slate-200">
						<div className="flex items-center gap-3 mb-3">
							<div className="w-8 h-8 bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
								{userEmail.charAt(0).toUpperCase()}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-slate-900 truncate">
									{userEmail}
								</p>
								<p className="text-xs text-slate-500">Admin</p>
							</div>
						</div>
						<button
							onClick={handleLogout}
							className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
						>
							<LogOut size={18} />
							Đăng xuất
						</button>
					</div>
				</div>
			</aside>

			{/* Mobile overlay */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Main */}
			<div className="lg:pl-64">
				{/* Header */}
				<header className="h-16 bg-white border-b border-slate-200 flex items-center px-6">
					<button
						onClick={() => setSidebarOpen(true)}
						className="lg:hidden text-slate-600 hover:text-slate-900 mr-4"
					>
						<Menu size={24} />
					</button>
					<h2 className="text-lg font-semibold text-slate-900">
						{menuItems.find((item) => item.href === pathname)?.label ||
							"Admin Panel"}
					</h2>
				</header>

				{/* Content */}
				<main className="p-6">{children}</main>
			</div>
		</div>
	);
}
