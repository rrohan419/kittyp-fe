import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: [
            "group toast",
            "group-[.toaster]:bg-background group-[.toaster]:text-foreground",
            "group-[.toaster]:border-2 group-[.toaster]:border-border",
            "group-[.toaster]:shadow-lg group-[.toaster]:shadow-primary/5",
            "group-[.toaster]:rounded-xl",
            "group-[.toaster]:p-4",
            "group-[.toaster]:w-fit",
            "group-[.toaster]:flex",
            "group-[.toaster]:items-start",
            "group-[.toaster]:gap-3",
            "group-[.toaster]:max-w-sm",
            "group-[.toaster]:px-4",
            "group-[.toaster]:py-3",
            "group-[.toaster]:text-sm",
            "group-[.toaster]:font-medium",
            "group-[.toaster]:rounded-lg",
            "group-[.toaster]:shadow-lg",
            "group-[.toaster]:shadow-primary/5",
            "group-[.toaster]:border-2",
            "group-[.toaster]:transition-all",
            "group-[.toaster]:animate-in group-[.toaster]:fade-in-0 group-[.toaster]:slide-in-from-right-full",
            "data-[type=success]:!bg-green-50 data-[type=success]:!border-green-500/30 data-[type=success]:!text-green-800 dark:data-[type=success]:!bg-green-950/30 dark:data-[type=success]:!text-green-300",
            "data-[type=error]:!bg-red-50 data-[type=error]:!border-red-500/30 data-[type=error]:!text-red-800 dark:data-[type=error]:!bg-red-950/30 dark:data-[type=error]:!text-red-300",
            "data-[type=info]:!bg-primary/5 data-[type=info]:!border-primary/30 data-[type=info]:!text-primary dark:data-[type=info]:!bg-primary-950/30 dark:data-[type=info]:!text-primary-300",
            "data-[type=warning]:!bg-yellow-50 data-[type=warning]:!border-yellow-500/30 data-[type=warning]:!text-yellow-800 dark:data-[type=warning]:!bg-yellow-950/30 dark:data-[type=warning]:!text-yellow-300",
          ].join(" "),
          title: [
            "group-[.toast]:font-semibold",
            "group-[.toast]:text-base",
            "group-[.toast]:mb-1",
            "group-[.toast]:leading-none"
          ].join(" "),
          description: [
            "group-[.toast]:text-sm",
            "group-[.toast]:opacity-90",
            "group-[.toast]:leading-relaxed"
          ].join(" "),
          actionButton: [
            "group-[.toast]:bg-primary",
            "group-[.toast]:text-primary-foreground",
            "group-[.toast]:shadow-sm",
            "hover:group-[.toast]:bg-primary/90",
            "group-[.toast]:rounded-lg",
            "group-[.toast]:font-medium",
            "group-[.toast]:text-sm",
            "group-[.toast]:h-9",
            "group-[.toast]:px-4",
            "group-[.toast]:ml-2",
            "group-[.toast]:transition-all"
          ].join(" "),
          cancelButton: [
            "group-[.toast]:bg-muted",
            "group-[.toast]:text-muted-foreground",
            "hover:group-[.toast]:bg-muted/90",
            "group-[.toast]:shadow-sm",
            "group-[.toast]:rounded-lg",
            "group-[.toast]:font-medium",
            "group-[.toast]:text-sm",
            "group-[.toast]:h-9",
            "group-[.toast]:px-4",
            "group-[.toast]:transition-all"
          ].join(" "),
        },
        duration: 800,
        unstyled: true,
      }}
      {...props}
    />
  )
}

export { Toaster }
