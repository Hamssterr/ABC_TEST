import { Link } from 'react-router-dom'
import { FileQuestion, Home } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
          <FileQuestion className="size-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          404 — Không tìm thấy trang
        </h1>
        <p className="mt-2 text-base text-muted-foreground max-w-md">
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã bị di chuyển trong hệ thống.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button asChild className="gap-2">
            <Link to="/customers">
              <Home className="size-4" />
              <span>Về trang chủ</span>
            </Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}
