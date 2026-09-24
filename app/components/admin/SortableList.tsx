"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId } from "react";

type Direction = "vertical" | "horizontal" | "grid";

const STRATEGY = {
  vertical: verticalListSortingStrategy,
  horizontal: horizontalListSortingStrategy,
  grid: rectSortingStrategy,
};

type SortableListProps<T> = {
  items: T[];
  getId: (item: T) => string;
  onReorder: (next: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  direction?: Direction;
  className?: string;
};

/**
 * 拖拉排序清單。
 *
 * 用 dnd-kit 而非原生 HTML5 drag events：後者在觸控裝置完全無作用，
 * 而後台需要能在 iPad 上操作。TouchSensor 的 250ms 延遲是為了與捲動
 * 區分 —— 沒有延遲的話，使用者想捲動頁面會變成把項目拖走。
 */
export default function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  direction = "vertical",
  className = "",
}: SortableListProps<T>) {
  const dndId = useId();

  const sensors = useSensors(
    // 滑鼠需移動 8px 才視為拖曳，否則單純點擊按鈕會被誤判
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = items.findIndex((item) => getId(item) === active.id);
    const to = items.findIndex((item) => getId(item) === over.id);
    if (from === -1 || to === -1) return;

    onReorder(arrayMove(items, from, to));
  };

  return (
    <DndContext
      // 不指定 id 時，dnd-kit 會用模組層級的全域計數器產生內部的
      // aria-describedby。伺服器端連續渲染多個清單會讓計數累加，
      // 瀏覽器端卻從零重新開始，兩邊對不上就報 hydration 錯誤。
      // useId 在 SSR 與 client 產生一致的值，正好消掉這個落差
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(getId)}
        strategy={STRATEGY[direction]}
      >
        <ul className={className}>
          {items.map((item, index) => (
            <SortableItem key={getId(item)} id={getId(item)}>
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        // 拖曳中的項目半透明並疊在最上層，讓使用者看得出正在搬哪一個
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      // touch-none 讓觸控裝置把手勢交給 dnd-kit，否則會被瀏覽器當成捲動
      className="touch-none"
      {...attributes}
      {...listeners}
    >
      {children}
    </li>
  );
}
