import { ButtonProps, Button } from "@cloudscape-design/components";
import useOnFollow from "../../common/hooks/use-on-follow";

interface CustomButtonProps extends ButtonProps {
  style?: React.CSSProperties;
  className?: string;
}

export default function RouterButton(props: CustomButtonProps) {
  
  const onFollow = useOnFollow();
  // console.log("i hate react so much")
  // console.log(props)

  return <Button {...props} onFollow={onFollow} />;
}
