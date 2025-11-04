import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page?: number;
    total?: number;
    from?: number | null;
    to?: number | null;
}

interface PaginationProps {
    pagination: PaginationData;
    onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
    if (pagination.last_page <= 1) {
        return null;
    }

    // Auto-determine max pages based on screen size (3 for mobile, 5 for desktop)
    const getMaxPages = (): number => {
        if (typeof window === 'undefined') return 5;
        return window.innerWidth < 640 ? 3 : 5;
    };

    const maxPages = getMaxPages();

    // Calculate which page numbers to show (sliding window)
    const getVisiblePages = (): number[] => {
        const { current_page, last_page } = pagination;
        const pages: number[] = [];

        if (last_page <= maxPages) {
            // Show all pages if total is less than max
            for (let i = 1; i <= last_page; i++) {
                pages.push(i);
            }
        } else if (current_page <= Math.ceil(maxPages / 2)) {
            // Near start: show first maxPages
            for (let i = 1; i <= maxPages; i++) {
                pages.push(i);
            }
        } else if (current_page >= last_page - Math.floor(maxPages / 2)) {
            // Near end: show last maxPages
            for (let i = last_page - maxPages + 1; i <= last_page; i++) {
                pages.push(i);
            }
        } else {
            // Middle: show current page centered
            for (let i = current_page - Math.floor(maxPages / 2); i <= current_page + Math.floor(maxPages / 2); i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Info text - hidden on mobile */}
            {pagination.from && pagination.to && (
                <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                    Showing {pagination.from} to {pagination.to} of {pagination.total} results
                </div>
            )}

            {/* Pagination controls */}
            <div className="flex items-center gap-1 sm:gap-2">
                {/* Previous button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="px-2 sm:px-3"
                >
                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {visiblePages.map(page => (
                        <Button
                            key={page}
                            variant={page === pagination.current_page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onPageChange(page)}
                            className="w-8 h-8 sm:w-9 sm:h-9 p-0 text-xs sm:text-sm"
                        >
                            {page}
                        </Button>
                    ))}
                </div>

                {/* Next button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="px-2 sm:px-3"
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                </Button>
            </div>
        </div>
    );
}
