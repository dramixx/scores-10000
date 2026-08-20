<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
		variants: {
			variant: {
				primary:
					'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]',
				success:
					'bg-success text-success-foreground shadow-sm hover:bg-success/90 active:scale-[0.98]',
				dark: 'bg-card-active text-card-active-foreground hover:bg-card-active/90 active:scale-[0.98]',
				secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				outline: 'border border-border bg-transparent hover:bg-accent',
				destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
			},
			size: {
				default: 'h-14 px-6 text-base',
				sm: 'h-10 px-4 text-sm',
				lg: 'h-16 px-8 text-lg',
				icon: 'h-11 w-11'
			}
		},
		defaultVariants: { variant: 'primary', size: 'default' }
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];
</script>

<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	let {
		class: className,
		variant = 'primary',
		size = 'default',
		type = 'button',
		children,
		...restProps
	}: HTMLButtonAttributes & { variant?: ButtonVariant; size?: ButtonSize } = $props();
</script>

<button {type} class={cn(buttonVariants({ variant, size }), className)} {...restProps}>
	{@render children?.()}
</button>
