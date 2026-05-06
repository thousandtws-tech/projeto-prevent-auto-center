//package br.com.tws.mscustomers.dto.factory;
//
//import lombok.NoArgsConstructor;
//
//import static lombok.AccessLevel.PRIVATE;
//
//
//@NoArgsConstructor(access = PRIVATE)
//public class VehicleDtoFactory {
//
//    public static VehicleDto criarVeiculocomTodosOsCampos(){
//        return VehicleDto.builder()
//                .Model("Civic")
//                .Brand("Honda")
//                .Plate("ABC1D23")
//                .ChassisNumber("9BWZZZ377VT004251")
//                .Mileage(45000L)
//                .Year(2020L)
//                .Color("Prata")
//                .build();
//    }
//
//    public static VehicleDto criarVeiculocomCamposVazios(){
//        return VehicleDto.builder()
//                .Model("Civic")
//                .Brand("Honda")
//                .Plate("ABC1D23")
//                .Mileage(45000L)
//                .Year(2020L)
//                .Color("Prata")
//                .build();
//    }
//
//    public static VehicleDto atualizarVeiculocomTodosOsCampos(){
//        return VehicleDto.builder()
//                .Model("Civic")
//                .Brand("Honda")
//                .Plate("ABC1D23")
//                .ChassisNumber("9BWZZZ377VT004251")
//                .Mileage(45000L)
//                .Year(2026L)
//                .Color("Preto")
//                .build();
//    }
//}
